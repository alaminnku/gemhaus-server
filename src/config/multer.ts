import multer, { MulterError } from 'multer';

// Upload function
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new MulterError('LIMIT_UNEXPECTED_FILE'));
    }
  },
});

// Upload types
export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files');
