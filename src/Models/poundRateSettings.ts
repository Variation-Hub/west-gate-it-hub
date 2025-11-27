import mongoose from 'mongoose';

const poundRateSettingsSchema = new mongoose.Schema({
  rate: {
    type: Number,
    required: true,
    min: 0.01
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false,
  minimize: false
});

const PoundRateSettings = mongoose.model('PoundRateSettings', poundRateSettingsSchema);

export default PoundRateSettings;
