import mongoose from "mongoose";
import rating_model from "../models/rating_model.js";

export const globalRatingService = async (userId , categoryId)=>{
    const userObjectId = mongoose.Types.ObjectId(userId);
    const categoryObjectId = mongoose.Types.ObjectId(categoryId);
    let result = await rating_model.aggregate(
        [
            {
                $match: {
                    user_id : userObjectId,
                    category_id : categoryObjectId
                }
            },
            {
                $group: {
                    _id: null,
                    total_field_one: { $sum: "$field_one" },
                    total_field_two: { $sum: "$field_two" },
                    total_field_three: { $sum: "$field_three" },
                    total_field_four: { $sum: "$field_four" },
                    total_field_five: { $sum: "$field_five" },
                    count: { $sum: 1 } // Count the number of documents
                }
            },
            {
                $project: {
                    _id: 0,
                    count: 1,
                    average_field_one: { $divide: ["$total_field_one", "$count"] },
                    average_field_two: { $divide: ["$total_field_two", "$count"] },
                    average_field_three: { $divide: ["$total_field_three", "$count"] },
                    average_field_four: { $divide: ["$total_field_four", "$count"] },
                    average_field_five: { $divide: ["$total_field_five", "$count"] }
                }
            }
        ]
    )
    if (result && result.length > 0) {            
        const total = (result[0].average_field_one + result[0].average_field_two + result[0].average_field_three) / (3 * result[0].count)
        return parseFloat(total).toFixed(2)
    }else{
        return 5
    }
}