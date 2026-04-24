const SystemConfig = require("../model/SystemConfig");

exports.getConfigs = async (req, res) => {
  try {
    const configs = await SystemConfig.find();
    res.status(200).json({ status: "success", data: configs });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const config = await SystemConfig.findOneAndUpdate(
      { key },
      { value, description },
      { new: true }
    );

    if (!config) {
      return res.status(404).json({ status: "error", message: "Config not found" });
    }

    res.status(200).json({ status: "success", message: "Cập nhật thành công", data: config });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

exports.createConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const existing = await SystemConfig.findOne({ key });
    if (existing) {
      return res.status(409).json({ status: "error", message: "Key already exists" });
    }

    const config = new SystemConfig({ key, value, description });
    await config.save();
    res.status(201).json({ status: "success", message: "Tạo thành công", data: config });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};
