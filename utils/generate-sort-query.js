

export function generateSort(sort) {
    let sortObject = {}
    if (sort) {
        let sortArray = sort.split(",")

        for (let i = 0; i < sortArray.length; i++) {
            sortObject[sortArray[i].split("@")[0]] = +sortArray[i].split("@")[1]
        }
        return sortObject
    }
    return { _id: 1 }
}