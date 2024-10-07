const Course = require("../models/course.model");

const axios = require("axios");

exports.getCourses = async (req, res) => {
  try {
    // Fetch courses from the database
    const courses = await Course.find();

    // Fetch video assets from TPStreams API
    const organizationId = process.env.TPSTREAMS_ORGANIZATION_ID; // Store this in your environment variables
    const tpstreamsApiUrl = `https://app.tpstreams.com/api/v1/${organizationId}/assets/`;

    const tpstreamsResponse = await axios.get(tpstreamsApiUrl, {
      headers: {
        Authorization: `token  ${process.env.TPSTREAMS_API_KEY}`, // You'll need to set up this API key
      },
    });

    const videoAssets = tpstreamsResponse.data.results;

    // Map over courses and add video information
    const coursesWithVideoInfo = courses.map((course) => {
      const courseObject = course.toObject(); // Convert to a plain JavaScript object
      const videoAsset = videoAssets.find(
        (asset) => asset.id === course.videoAssetId
      );

      if (videoAsset) {
        courseObject.video = {
          title: videoAsset.title,
          type: videoAsset.type,
          thumbnails: videoAsset.video?.thumbnails || [],
          playbackUrl: videoAsset.video?.playback_url || null,
          duration: videoAsset.video?.duration || null,
          viewsCount: videoAsset.views_count,
          averageWatchedTime: videoAsset.average_watched_time,
        };
      }

      return courseObject;
    });

    // res.json(coursesWithVideoInfo);
    res.json(videoAssets);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res
      .status(500)
      .json({ message: "Error fetching courses", error: error.message });
  }
};

exports.purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Add course to user's purchased courses
    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedCourses: courseId },
    });

    res.json({ message: "Course purchased successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error purchasing course" });
  }
};

exports.uploadVideoAndUpdateCourse = async (req, res) => {
  try {
    const { courseId, videoTitle, videoUrl, resolutions, folder } = req.body;

    // Validate input
    if (!courseId || !videoTitle || !videoUrl) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if the course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Prepare the request to TPStream
    const organizationId = process.env.TPSTREAMS_ORGANIZATION_ID;
    const tpstreamsApiUrl = `https://app.tpstreams.com/api/v1/${organizationId}/assets/videos/`;

    const videoData = {
      title: videoTitle,
      inputs: [{ url: videoUrl }],
      resolutions: resolutions || ["240p", "360p", "480p", "720p"],
      content_protection_type: "drm",
      folder: folder || null,
    };

    // Make the request to TPStream
    const tpstreamsResponse = await axios.post(tpstreamsApiUrl, videoData, {
      headers: {
        Authorization: `Bearer ${process.env.TPSTREAMS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // Extract the video asset ID from the TPStream response
    const videoAssetId = tpstreamsResponse.data.id;

    // Update the course in your database with the new video asset ID
    course.videoAssetId = videoAssetId;
    await course.save();

    res.status(200).json({
      message: "Video uploaded successfully and course updated",
      courseId: course._id,
      videoAssetId: videoAssetId,
    });
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({
      message: "Error uploading video",
      error: error.response?.data || error.message,
    });
  }
};
