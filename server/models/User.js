const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    role: {type: String, enum: ['admin', 'user'], default: 'user'},
    name: {type: String, required: true},
    phone: {type: String, required: true, unique: true},
    password: {type: String, required: true, minlength: 6},
    location: {type: String},
    createdAt: {type: Date, default: Date.now},
    refreshToken: {type: String}
});

//hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

//Compare password
userSchema.methods.matchPassword = async function (inputPassword) {
    return await bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);