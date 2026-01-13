import React, { useState } from 'react';

const FeedbackForm = ({ orderId, onSuccess, onCancel, onFeedbackSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

        try {
          const { deliveryService } = await import('../services/api');
          await deliveryService.submitFeedback(orderId, rating, comment || null);
      
      if (onSuccess) {
        onSuccess();
      }
      // Also support the old prop name for backward compatibility
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
      // Also support the old prop name for backward compatibility
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit feedback. Please try again.');
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
    setError('');
  };

  return (
    <div className="card">
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">
          <i className="bi bi-star"></i> Rate Your Delivery Experience
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-bold">Rating</label>
            <div className="rating-input d-flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`btn btn-lg ${
                    rating >= value ? 'btn-warning' : 'btn-outline-secondary'
                  }`}
                  onClick={() => handleRatingClick(value)}
                  disabled={submitting}
                >
                  <i className="bi bi-star-fill"></i>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="mt-2 text-muted">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="feedbackComment" className="form-label fw-bold">
              Comments (Optional)
            </label>
            <textarea
              className="form-control"
              id="feedbackComment"
              rows="4"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this delivery..."
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || rating === 0}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle"></i> Submit Feedback
                </>
              )}
            </button>
            {onCancel && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;
