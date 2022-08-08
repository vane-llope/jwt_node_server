require('dotenv').config()
const express = require('express')
const app = express()
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

//middleware
app.use(cors({
    credentials : true,
    origin : ['http://localhost:8080']
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))


//functios

//test
app.get('/login', (req, res) => {
    // const {name} = req.body.
    const name = 'shaun'
    const email = 'shaun@gmail.com'
    const password = "shaun12"
    const hashedPass = '$2a$10$opQsWMI5Qf0LluMznYvmneOkfQLsmfdqss2QsjDePj48jWm6I07FC'

    bcrypt.compare(password, hashedPass, (err, result) => {
        if (err) throw err
    })

    const options = {
        exportsIn: '20m',
        httpOnly: true
    }

    const token = jwt.sign({name:name, email: email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1y',
        audience: email
    })

    res.cookie('jwt', token, options)
    res.sendStatus(200)
})

app.get('/refreshToken',validateCookie,(req,res) => {
    const respond = {info : req.info , refreshToken : req.refreshToken}
   
     res.send (respond)
})

app.get('/protected', verifyToken, (req, res) => {
    const msg = {
        data: 'you are authorized'
    }
    res.send(msg)
})

app.get('/logout', (req, res) => {
    const options = {
        exportsIn: '1',
        httpOnly: true
    }
    res.cookie('jwt', '', options)
    res.sendStatus(200)
})


function validateCookie(req, res, next) {
    const { cookies } = req
    //console.log(cookies.jwt)
    jwt.verify(cookies.jwt, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) console.log('not authorized')
        else {
           refreshToken =   generateRefreshToken({ email: user.email })
            req.refreshToken = refreshToken
            req.info = {name : user.name , email : user.email}
            next()
        }
    })
}


  function generateRefreshToken (info){
   return( jwt.sign(info, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '20m'
    }))
   
}

function verifyToken(req, res, next) {
    if (!req.headers['authorization']) return next(createError.Unauthorized())
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null) return res.sendStatus('401')
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            const message = err.name === 'JsonWebTokenError' ? 'Unauthorized' : err.message
            return next(createError.Unauthorized(message))
        }
        next()
    })

}


app.listen(3000, () => console.log('listening on port 3000'))