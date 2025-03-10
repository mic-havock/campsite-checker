import PropTypes from "prop-types";
import ReactImageGallery from "react-image-gallery";
import "react-image-gallery/styles/scss/image-gallery.scss";
import "./image-gallery.scss";

const ImageGallery = ({
  images,
  showPlayButton = false,
  showFullscreenButton = true,
  showNav = true,
  thumbnailPosition = "bottom",
  lazyLoad = true,
  showIndex = true,
}) => {
  if (!images || images.length === 0) {
    return <div className="no-image-container">No Images Available</div>;
  }

  return (
    <div className="media-section">
      <ReactImageGallery
        items={images}
        showPlayButton={showPlayButton}
        showFullscreenButton={showFullscreenButton}
        showNav={showNav}
        thumbnailPosition={thumbnailPosition}
        lazyLoad={lazyLoad}
        showIndex={showIndex}
      />
    </div>
  );
};

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      original: PropTypes.string.isRequired,
      thumbnail: PropTypes.string.isRequired,
      description: PropTypes.string,
      originalAlt: PropTypes.string,
      thumbnailAlt: PropTypes.string,
    })
  ).isRequired,
  showPlayButton: PropTypes.bool,
  showFullscreenButton: PropTypes.bool,
  showNav: PropTypes.bool,
  thumbnailPosition: PropTypes.oneOf(["bottom", "top", "left", "right"]),
  lazyLoad: PropTypes.bool,
  showIndex: PropTypes.bool,
};

export default ImageGallery;
