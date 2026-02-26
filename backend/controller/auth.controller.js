import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../model/User.model.js';

export const register = async(req, res)=>{
    try{
        const {username, email, password} = req.body;
        
        if(!username || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashed,
        });
        res.status(201).json({message: "User registered successfully"});
    }catch(err){
        res.status(500).json({message: "Error registering user", error: err.message});
    }
}

export const login = async(req, res)=>{
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message: "Email and password are required"});
        }

        const user = await User.findOne({email});
        if(!user) return res.status(404).json({message: "User not found"});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: "Invalid credentials"});

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
            }, process.env.JWT_SECRET, {expiresIn: "1h"}
        );

        res.status(200).json({message: "Login successful", token});
    }catch(err){
        res.status(500).json({message: "Error during login", error: err.message});
    }
}