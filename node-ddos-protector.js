let fs = require("fs");

class DdosProtector {
    constructor(){
        this.individualUsers = [{ ip: "999.999.999.999", count: 1,  }];
        this.attackTimespan = 30;
        this.attackCount = 20;
        this.banTime = 7200;
        this.bannedUsers = [];
        this.errorCode = 429;
        this.whitelist = null;
    }

    init(options = null){
        if(options) {
            this.attackTimespan = options.attackTimespan ? options.attackTimespan : this.attackTimespan;
            this.attackCount = options.attackCount ? options.attackCount : this.attackCount;
            this.banTime = options.banTime ? options.banTime : this.banTime;
            this.errorCode = options.errorCode ? options.errorCode : this.errorCode;
        }

        return this;
    }

    handleBanningAndAllowing(req, res){
        let anyRepeatedAttack = false;
        let banEnded = false;
        let userWhichReAllowed = null;

        for(let i = 0; i < this.individualUsers.length; i++){
            if(this.individualUsers[i].isBanned){
                let now = new Date().getTime();

                if(now > this.individualUsers[i].dateToBeBanned){
                    this.individualUsers[i].isBanned = false;

                    banEnded = true;

                    userWhichReAllowed = this.individualUsers[i];
                } else {
                    this.banUser(req, res);
                }
            }
        }

        if(userWhichReAllowed){
            this.individualUsers = this.individualUsers.filter(param => param.ip !== userWhichReAllowed.ip)

            this.unBanUser(req, res, userWhichReAllowed.ip);
        }

        for(let i = 0; i < this.individualUsers.length; i++){
            let now = new Date().getTime();

            if((now > (this.individualUsers[i].startTime + (this.attackTimespan * 1000))) && 
                this.individualUsers[i].count < this.attackCount){

                this.individualUsers = this.individualUsers.filter(param => param.ip !== this.individualUsers[i].ip);

            }
        }
        
        if(!banEnded){
            for(let i = 0; i < this.individualUsers.length; i++){
                if(this.individualUsers[i].ip === req.socket.remoteAddress){
                    if(!this.individualUsers[i].isBanned){
                        this.individualUsers[i].count = this.individualUsers[i].count + 1;
                    }
            
                    let now = new Date().getTime();
            
                    if(((this.individualUsers[i].count === this.attackCount) || 
                    (this.individualUsers[i].count > this.attackCount)) && 
                    (now - this.individualUsers[i].startTime) < (this.attackTimespan * 1000)){

                        this.individualUsers[i].isBanned = true;

                        this.individualUsers[i].count = 0;
    
                        this.individualUsers[i].dateToBeBanned = new Date().getTime() + (this.banTime * 1000);
        
                        this.banUser(req, res);
                    }
            
                    anyRepeatedAttack = true;
            
                    break;
                }
            }
        }

        if(!anyRepeatedAttack) {
            if(this.whitelist !== null){
                let listMemberFound = false;

                for(let i = 0; i < this.whitelist.length; i++){
                    if(this.whitelist[i] === req.socket.remoteAddress){
                        listMemberFound = true;
                        break;
                    }
                }

                if(!listMemberFound){
                    this.individualUsers.push({ ip: req.socket.remoteAddress, count: 1, startTime: new Date().getTime(), isBanned: false, dateToBeBanned: null });
                }
            } else {
                this.individualUsers.push({ ip: req.socket.remoteAddress, count: 1, startTime: new Date().getTime(), isBanned: false, dateToBeBanned: null });
            }
        }

        return this;
    }

    banUser(req, res){
        res.statusCode = this.errorCode;
        res.setHeader("X-Ban-Reason", "Spamming")
    }

    unBanUser(req, res, userId){
        res.statusCode = 200;
        res.setHeader("X-Unban-User", userId)
    }

    openWhitelist(list){
        this.whitelist = [];

        if(Array.isArray(list)){
            for(let i = 0; i < list.length; i++){
                this.whitelist.push(list[i]);        
            }
        }

        if(typeof list === "string"){
            fs.readFile(list, "utf8", function(err, data){
                if(err){
                    console.log("Error when reading file: ", err)
                }

                let splitTheData = data.split("\n");

                for(let i = 0; i < splitTheData.length; i++){
                    this.whitelist.push(splitTheData[i].trim())
                }
            }.bind(this));
        }

        return this;
    }

    logEverything(){
        console.log("attack count: ", this.attackCount);
        console.log("ban length: ", this.attackTimespan);
        console.log("exact banned time as second: ", this.banTime)
        console.log("counted users: ", this.individualUsers);
        console.log("banned users: ", this.bannedUsers);
        console.log("error code: ", this.errorCode);
    }
}

module.exports = {
    DdosProtector
}