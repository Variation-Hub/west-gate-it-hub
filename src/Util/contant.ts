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

export const projectStatus = {
    Inprogres: 'InProgress',
    InSolution: 'InSolution',
    InReviewWestGate: 'InReviewWestGate',
    InReview: 'InReview',
    InReviewBidWritingCompany: 'InReviewBidWritingCompany',
    ReSolution: 'ReSolution',
    UnderSubmission: 'UnderSubmission',
    AwardedOrNotAwarded: 'AwardedOrNotAwarded'
}

export const userRoles = {
    BOS: 'BOS',
    SupplierAdmin: 'SupplierAdmin',
    SupplierUser: 'SupplierUser'
}