const RequestService = require('../service/RequestService');

class RequestFacade{
    static async approveRequest(id){
        return await RequestService.approveRequest(id);
    }

    static async rejectRequest(id){
        return await RequestService.rejectRequest(id);
    }
}

module.exports = RequestFacade;
