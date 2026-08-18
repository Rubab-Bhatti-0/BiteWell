const mongoose=require('mongoose')

const TreatmentSchema = new mongoose.Schema( {  
    clinicId: { type: "ObjectId", ref: "Clinic" },  
    name: String,  
    defaultCost: Number,  
    category: String,  
    isActive: Boolean,});

const TreatmentModel=mongoose.model('Treatment',TreatmentSchema)
module.exports=TreatmentModel