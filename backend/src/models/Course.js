const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title:           { type: String, required: true },
    type:            { type: String, enum: ['video', 'document'], default: 'video' },
    content:         { type: String, default: '' },
    durationMinutes: { type: Number, default: 10 }
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    category:     { type: String, default: 'General' },
    level:        { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    price:        { type: Number, default: 0 },
    coverImageUrl:{ type: String, default: '' },
    modules:      [moduleSchema],
    instructor: {
      id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String }
    },
    isPublished:  { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
