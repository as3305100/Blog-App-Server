import multer from "multer";
import { ApiError } from "../middlewares/error.middleware.js"

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./temp")
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.floor(Math.random() * 1000)
        cb(null, uniqueSuffix + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ]

    if(allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    }else{
        cb(new ApiError(400, "Only images of jpg, jpeg, png and webp format are allowed"), false)
    }
}

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
})