const mongoose=require('mongoose')

const PatientSchema = new mongoose.Schema({  
    clinicId: { type: "ObjectId", ref: "Clinic" },  
    name: String,  
    phone: String,  
    email: String,  
    age: Number,  
    gender: { type: String, enum: ["male", "female", "other"] },  
    bloodGroup: String,  
    allergies: [String],  
    medicalConditions: [String],  
    notes: String,  
    status: { type: String, enum: ["cleared", "uncleared"] },  
    toothChart: [    {      
        toothNumber: Number,      
        condition: String,      
        treatmentId: { type: "ObjectId", ref: "Treatment" },      
        notes: String,    },  ],  
        attachments: [{ url: String, type: String, uploadedAt: Date }],  
    },{timestamps:true});

PatientSchema.index({ clinicId: 1, name: 1 });
PatientSchema.index({ clinicId: 1, phone: 1 });

const PatientModel=mongoose.model('Patient',PatientSchema)
module.exports=PatientModel