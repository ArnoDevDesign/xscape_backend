const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    // firstname: String,
    // lastname: String,
    username: String,
    email: String,
    password: String,
    token: String,
    totalPoints: Number,
    // phoneNumber: Number,
    avatar: String,
    scenarios: [{ type: mongoose.Schema.Types.ObjectId, ref: "Scenario" }], // Référence aux scénarios joués 
});

const User = mongoose.model('users', userSchema);

module.exports = User;