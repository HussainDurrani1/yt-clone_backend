import multer from 'multer'
// const upload = multer({ dest: '.../public' })


const storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, "../public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({ storage, })