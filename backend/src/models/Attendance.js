import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    usn: { type: String, required: true, uppercase: true, trim: true },
    ip: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    distanceFromVenue: { type: Number },
    userAgent: { type: String },
    // YYYY-MM-DD (server date)
    day: { type: String, required: true },
  },
  { timestamps: true }
);

// One entry per USN per day
attendanceSchema.index({ usn: 1, day: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
