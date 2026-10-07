import Attendance from '../models/Attendance.js';
import { distanceMeters } from '../utils/geo.js';

const USN_REGEX = /^[A-Z0-9]{6,20}$/;

export async function submitAttendance(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const usn = String(req.body.usn || '').trim().toUpperCase();
    const lat = Number(req.body.latitude);
    const lng = Number(req.body.longitude);
    const accuracy = req.body.accuracy != null ? Number(req.body.accuracy) : undefined;

    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ message: 'Enter a valid name (2–80 characters).' });
    }
    if (!USN_REGEX.test(usn)) {
      return res.status(400).json({ message: 'Enter a valid USN (letters and digits only).' });
    }

    let distance;
    const lockOn = process.env.ENFORCE_LOCATION_LOCK !== 'false';
    const hasCoords =
      Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

    if (lockOn) {
      if (!hasCoords) {
        return res.status(400).json({
          code: 'LOCATION_REQUIRED',
          message: 'Location is required. Allow location access and try again.',
        });
      }
      const maxAcc = Number(process.env.MAX_ACCURACY_METERS || 100);
      if (accuracy != null && Number.isFinite(accuracy) && accuracy > maxAcc) {
        return res.status(400).json({
          code: 'LOW_ACCURACY',
          message: `Location accuracy is too low (${Math.round(accuracy)} m). Move to an open area and retry.`,
        });
      }
      distance = distanceMeters(
        lat,
        lng,
        Number(process.env.VENUE_LAT),
        Number(process.env.VENUE_LNG)
      );
      const radius = Number(process.env.ALLOWED_RADIUS_METERS || 100);
      if (!Number.isFinite(distance) || distance > radius) {
        return res.status(403).json({
          code: 'LOCATION_LOCKED',
          message: 'You are outside the allowed area.',
        });
      }
    }

    const day = new Date().toLocaleDateString('en-CA', {
      timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
    });

    const record = await Attendance.create({
      name,
      usn,
      ip: req.clientIp,
      latitude: hasCoords ? lat : undefined,
      longitude: hasCoords ? lng : undefined,
      accuracy,
      distanceFromVenue: distance != null ? Math.round(distance) : undefined,
      userAgent: req.get('user-agent'),
      day,
    });

    res.status(201).json({
      message: 'Attendance recorded.',
      record: { name: record.name, usn: record.usn, time: record.createdAt },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ code: 'USN_DUPLICATE', message: 'Attendance already marked for this USN today.' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
}

export async function listAttendance(req, res) {
  const filter = req.query.day ? { day: String(req.query.day) } : {};
  const records = await Attendance.find(filter).sort({ createdAt: -1 }).limit(1000);
  res.json(records);
}
