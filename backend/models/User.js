const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userType: { 
        type: String, 
        enum: ['admin', 'user', 'vet'],
        default: 'user'
    },
    licenseNumber: {
        type: String,
        validate: {
            validator: function (val) {
                if (this.userType !== 'vet') return true;
                return /^[0-9]{6,7}$/.test(val); // 6–7 digits
            },
            message: 'License number must be 6–7 digit numeric value'
        },
        required: function () {
            return this.userType === 'vet';
        },
        unique: true,
        sparse: true // allows null values for non-vets
    },
    profilePhoto: { 
        type: String, 
        default: function() {
            return `${process.env.CLOUDINARY_BASE_URL}/default_profile.png`;
        }
    },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
