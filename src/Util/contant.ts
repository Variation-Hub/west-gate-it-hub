export const ImagesType = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/jfif"]

export const isValidType = (type: string, types: string[]) => {
    if (types.includes(type)) {
        return true
    } else {
        return false
    }
}

export const generatePass = () => {
    let pass = '';
    let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';

    for (let i = 1; i <= 8; i++) {
        let char = Math.floor(Math.random()
            * str.length + 1);

        pass += str.charAt(char)
    }

    return pass;
}

// export const projectStatus = {
//     Awaiting: 'Awaiting',
//     Inhold: 'Inhold',
//     Pass: 'Pass',
//     Fail: 'Fail',
//     Inprogress: 'InProgress',
//     InSolution: 'InSolution',
//     InReviewWestGate: 'InReviewWestGate',
//     InReview: 'InReview',
//     InReviewBidWritingCompany: 'InReviewBidWritingCompany',
//     ReSolution: 'ReSolution',
//     UnderSubmission: 'UnderSubmission',
//     Awarded: 'Awarded',
//     westgate writing: 'NotAwarded',
//     Submitted: 'Submitted',
//     Closed: "Closed",
//     InSubmition: "InSubmition",
//     Expired: "Expired",
//     WaitingForResult: "WaitingForResult",
//     Won: "Won",
// }

export const projectStatus = {
    Awaiting: "Awaiting",
    DocumentsNotFound: "Documents not found",
    Dropped: "Dropped",
    DroppedAfterFeasibility: "⁠Dropped after feasibility",
    Failed: "Failed",
    HandoveredToOtherSupplier: "⁠Handovered to other supplier",
    Passed: "Passed",
    Submitted: "Submitted",
    InSolution3rdParty: "InSolution3rdParty",
    InSolution: "InSolution",
    InReviewWestGate: "InReviewWestGate",
    InReviewSHU: "InReviewSHU",
    InReview3rdParty: "InReview3rdParty",
    InSubmission: "InSubmission",
    WaitingForResult: "WaitingForResult",
    Awarded: "Awarded",
    NotAwarded: "NotAwarded",
    Won: "Won",
    Inhold: 'InHold',
    Inprogress: 'InProgress',
    Pass: 'Pass',
    Fail: 'Fail',
    QueryRaised: "Query Raised",
    NoDocuments: "No documents"
}

export const projectStatus1 = {
    InSolution: "In solution",
    InReview: "In-review",
    InSubmission: "In-Submission",
    submitted: "submitted",
    awarded: "awarded",
    notAwarded: "not awarded",
    dropped: "dropped"
}

export const BidWritingStatus = {
    UKExpertReview: "UK expert review",
    ukExpertWriting: "uk expert writing",
    thirdExpertReview: "third expert review",
    thirdPartyExpertWriting: "third party expert writing",
    westgateReview: "westgate review",
    westgateWriting: "westgate writing"
}

export const projectCategory = {
    WebDevelopment: 'Web Development',
    Testing: 'Testing',
    DataBase: 'DataBase',
    Andoid: 'Andoid',
    ArtificialIntelligence: 'Artificial Intelligence',
}

export const userRoles = {
    BOS: 'BOS',
    SupplierAdmin: 'SupplierAdmin',
    SupplierUser: 'SupplierUser',
    FeasibilityAdmin: 'FeasibilityAdmin',
    FeasibilityUser: 'FeasibilityUser',
    ProjectManager: 'ProjectManager',
    UKWriter: 'UKWriter',
    BIDSubmition: 'BIDSubmition',
    Admin: 'Admin',
    ProjectCoOrdinator: 'ProjectCoOrdinator',
    User: 'User',
    ProcessManagerAdmin: 'ProcessManagerAdmin',
}

export const userStatus = {
    Active: 'Active',
    Inactive: 'Inactive'
}

export const summaryQuestionFor = {
    Supplier: 'Supplier',
    UKWriter: 'UKWriter',
}

export const summaryQuestionType = {
    Text: 'Text',
    File: 'File',
}

export const socketEvent = {
    Message: 'message',
    Notification: 'notification',
    Support: 'support'
}

export const taskStatus = {
    Todo: 'Todo',
    Ongoing: 'Ongoing',
    Completed: 'Completed'
}