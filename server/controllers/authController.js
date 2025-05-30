const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        {id: user._id, role: user.role, phone: user.phone},
        process.env.JWT_ACCESS_KEY,
        {expritesIn: '7d'}
    );
};

const authController = {
    //REGISTER
    register: async (req, res) => {
        try {
            const {name, phone, password, location} = req.body;
            const existingUser = await User.findOne({phone});
            if (existingUser) {
                return res.status(400).json({message: 'This phone number has registered'});
            }

            const newUser = new User({name, phone, password, location});
            await newUser.save();
            
            const token = generateToken(newUser);
            res.status(201).json({
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    phone: newUser.phone,
                    role: newUser.role
                },
                token
            })
        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    },

    //LOGIN
    login: async (req, res) => {
        try {
            const {phone, password} = req.body;
            const user = await User.findOne({phone});

            if (!user) {
                return res.status(400).json({message: 'No user'});
            }

            const token = generateToken(user);
            res.status(200).json({
                user: {
                    id: user._id,
                    name: user.name,
                    role: user.role,
                    phone: user.phone
                },
                token
            });
        } catch (err) {
            return res.status(500).json({message: err.message});
        }
    }
}

module.exports = authController;