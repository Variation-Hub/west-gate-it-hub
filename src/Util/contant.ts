export const ImagesType = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/jfif"]

export const isValidType = (type: string, types: string[]) => {
    if (types.includes(type)) {
        return true
    } else {
        return false
    }
}
