import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function StyleAdvisor() {
  const navigate = useNavigate();

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // ==========================================
  // IMAGE SELECTION
  // ==========================================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    setError("");
    setSuccess("");
    setAnalysis(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WebP images are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // ==========================================
  // ANALYZE STYLE
  // ==========================================

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError("Please upload a photo first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      setAnalysis(null);

      const formData = new FormData();
      formData.append("photo", selectedImage);

      const response = await api.post("/style/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Style Advisor response:", response.data);

      if (
        !response.data?.visualAnalysis ||
        !response.data?.recommendations
      ) {
        throw new Error("AI returned incomplete style recommendations.");
      }

      setAnalysis({
        visualAnalysis: response.data.visualAnalysis,
        recommendations: response.data.recommendations,
        profile: response.data.profile,
      });

      setSuccess("Your personalized style analysis is ready!");
    } catch (err) {
      console.error("Style Advisor error:", err);

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to analyze your photo. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // START NEW ANALYSIS
  // ==========================================

  const handleNewAnalysis = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl("");
    setAnalysis(null);
    setError("");
    setSuccess("");
  };

  // ==========================================
  // RESULT DATA
  // ==========================================

  const visual = analysis?.visualAnalysis;
  const recommendations = analysis?.recommendations;

  const clothing = recommendations?.clothing || {};
  const fit = recommendations?.recommendedFit || {};
  const colors = recommendations?.colorPalette || {};

  const outfitIdeas = safeArray(recommendations?.outfitIdeas);
  const stylingTips = safeArray(recommendations?.stylingTips);
  const budgetTips = safeArray(recommendations?.budgetFriendlyTips);
  const stylesToUseCarefully = safeArray(
    recommendations?.stylesToUseCarefully
  );

  const recommendedColors = safeArray(colors.recommended);
  const carefulColors = safeArray(colors.useCarefully);

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="style-advisor-page">
      {/* HEADER */}
      <div className="style-advisor-header">
        <button
          type="button"
          className="style-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

        <div>
          <p className="eyebrow">AI-powered personal styling</p>
          <h1>👕 AI Style Advisor</h1>
          <p>
            Get personalized fashion recommendations based on your photo and profile.
          </p>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="style-advisor-container">
          <div className="style-analysis-loading">
            <div className="style-loading-icon">✨</div>
            <h2>Creating Your Personal Style Guide</h2>
            <p>
              Our AI is analyzing your photo and creating personalized recommendations.
            </p>

            <div className="style-loading-steps">
              <div><span>✓</span> Analyzing visible style</div>
              <div><span>✓</span> Understanding proportions</div>
              <div><span>✓</span> Checking colors</div>
              <div><span>✨</span> Creating personalized outfits</div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {!loading && analysis && (
        <div className="style-advisor-container">
          <div className="style-results">

            {/* RESULTS HEADER */}
            <div className="style-results-header">
              <div>
                <p className="eyebrow">Your personal style guide</p>
                <h2>✨ Your AI Style Analysis</h2>
                <p>
                  Personalized recommendations generated from your photo and existing profile.
                </p>
              </div>

              <button
                type="button"
                className="style-new-analysis-button"
                onClick={handleNewAnalysis}
              >
                📸 New Analysis
              </button>
            </div>

            {/* TOP SECTION */}
            <div className="style-results-top">
              {/* PHOTO */}
              <div className="style-result-photo-card">
                <img
                  src={previewUrl}
                  alt="Style analysis"
                  className="style-result-photo"
                />
                <div className="style-confidence">
                  <span>AI confidence</span>
                  <strong>{visual?.confidence || "medium"}</strong>
                </div>
              </div>

              {/* PERSONALIZED SUMMARY */}
              <div className="style-summary-card">
                <p className="eyebrow">Personalized recommendation</p>
                <h2>Your Style Direction</h2>
                <p className="style-summary-text">
                  {recommendations?.personalizedSummary ||
                    visual?.visualSummary ||
                    "Your personalized style recommendations are ready."}
                </p>
              </div>
            </div>

            {/* VISUAL ANALYSIS */}
            {visual && (
              <div className="style-result-card">
                <h3 className="style-section-heading">🧍 Visual Style Analysis</h3>
                <div className="style-proportion-grid">
                  <div>
                    <span>Overall</span>
                    <strong>{visual.visibleProportions?.overall || "Not clearly determined"}</strong>
                  </div>
                  <div>
                    <span>Upper body</span>
                    <strong>{visual.visibleProportions?.upperBody || "Not clearly determined"}</strong>
                  </div>
                  <div>
                    <span>Lower body</span>
                    <strong>{visual.visibleProportions?.lowerBody || "Not clearly determined"}</strong>
                  </div>
                  <div>
                    <span>Height proportion</span>
                    <strong>{visual.visibleProportions?.heightProportion || "Approximate"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* CURRENT STYLE */}
            {visual?.currentStyle && (
              <div className="style-result-card">
                <h3 className="style-section-heading">👔 Current Style</h3>
                <div className="style-current-fit">
                  <div>
                    <span>Style</span>
                    <strong>{visual.currentStyle.description || "Not clearly determined"}</strong>
                  </div>
                  <div>
                    <span>Current fit</span>
                    <strong>{visual.currentStyle.fit || "Not clearly determined"}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* FIT RECOMMENDATIONS */}
            <div className="style-result-card">
              <h3 className="style-section-heading">📏 Recommended Fits</h3>
              <div className="style-proportion-grid">
                <div><span>Overall</span><strong>{fit.overall || "Balanced fit"}</strong></div>
                <div><span>Shirts</span><strong>{fit.shirts || "Regular fit"}</strong></div>
                <div><span>T-Shirts</span><strong>{fit.tshirts || "Regular fit"}</strong></div>
                <div><span>Jeans</span><strong>{fit.jeans || "Straight or regular fit"}</strong></div>
                <div><span>Trousers</span><strong>{fit.trousers || "Straight or tapered fit"}</strong></div>
                <div><span>Jackets</span><strong>{fit.jackets || "Clean structured fit"}</strong></div>
              </div>
            </div>

            {/* COLORS */}
            <div className="style-result-card">
              <h3 className="style-section-heading">🎨 Recommended Color Palette</h3>
              {recommendedColors.length > 0 ? (
                <div className="style-color-list">
                  {recommendedColors.map((color, index) => (
                    <span className="style-color-tag" key={index}>{color}</span>
                  ))}
                </div>
              ) : (
                <p>No specific colors were returned.</p>
              )}

              {carefulColors.length > 0 && (
                <div className="style-result-warning">
                  <strong>Colors to use carefully</strong>
                  <div className="style-color-list">
                    {carefulColors.map((color, index) => (
                      <span className="style-color-tag" key={index}>{color}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CLOTHING */}
            <div className="style-result-card">
              <h3 className="style-section-heading">👕 Clothing Recommendations</h3>
              <div className="style-clothing-grid">
                <ClothingCategory title="Shirts" icon="👔" items={clothing.shirts} />
                <ClothingCategory title="T-Shirts" icon="👕" items={clothing.tshirts} />
                <ClothingCategory title="Jackets" icon="🧥" items={clothing.jackets} />
                <ClothingCategory title="Jeans" icon="👖" items={clothing.jeans} />
                <ClothingCategory title="Trousers" icon="🩳" items={clothing.trousers} />
                <ClothingCategory title="Footwear" icon="👟" items={clothing.footwear} />
              </div>
            </div>

            {/* STYLES TO USE CAREFULLY */}
            {stylesToUseCarefully.length > 0 && (
              <div className="style-result-card">
                <h3 className="style-section-heading">⚠️ Styles to Use Carefully</h3>
                <ul className="style-advice-list">
                  {stylesToUseCarefully.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* OUTFIT IDEAS */}
            <div className="style-result-card">
              <h3 className="style-section-heading">✨ Complete Outfit Ideas</h3>
              {outfitIdeas.length > 0 ? (
                <div className="style-outfit-grid">
                  {outfitIdeas.map((outfit, index) => (
                    <div className="style-outfit-card" key={index}>
                      <div className="style-outfit-number">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <h4>{outfit.name || `Outfit ${index + 1}`}</h4>
                      <span className="style-outfit-occasion">
                        {outfit.occasion || "Everyday"}
                      </span>

                      <div className="style-outfit-details">
                        <p><strong>Top:</strong> {outfit.top || "Not specified"}</p>
                        <p><strong>Bottom:</strong> {outfit.bottom || "Not specified"}</p>
                        <p><strong>Footwear:</strong> {outfit.footwear || "Not specified"}</p>
                      </div>

                      {safeArray(outfit.colors).length > 0 && (
                        <div className="style-outfit-colors">
                          {safeArray(outfit.colors).map((color, colorIndex) => (
                            <span key={colorIndex}>{color}</span>
                          ))}
                        </div>
                      )}

                      {outfit.whyItWorks && (
                        <p className="style-outfit-why">{outfit.whyItWorks}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p>No complete outfit ideas were returned.</p>
              )}
            </div>

            {/* STYLING TIPS */}
            {stylingTips.length > 0 && (
              <div className="style-result-card">
                <h3 className="style-section-heading">💡 Personalized Styling Tips</h3>
                <div className="style-tips-list">
                  {stylingTips.map((tip, index) => (
                    <div className="style-tip" key={index}>
                      <span>{index + 1}</span>
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BUDGET TIPS */}
            {budgetTips.length > 0 && (
              <div className="style-result-card">
                <h3 className="style-section-heading">💰 Budget-Friendly Style Tips</h3>
                <ul className="style-advice-list">
                  {budgetTips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* DISCLAIMER */}
            <div className="style-disclaimer">
              <strong>ℹ️ About AI Style Analysis</strong>
              <p>
                These recommendations are based on visible styling factors and the information in your profile.
                Image analysis can be affected by lighting, camera angle, clothing and image quality.
              </p>
            </div>

            {/* NEW ANALYSIS BUTTON */}
            <div className="style-results-actions">
              <button
                type="button"
                className="primary"
                onClick={handleNewAnalysis}
              >
                📸 Analyze Another Photo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* UPLOAD SCREEN */}
      {!loading && !analysis && (
        <div className="style-advisor-container">
          <div className="style-upload-card">
            <div className="style-upload-content">
              <div>
                <div className="style-icon">👕</div>
                <p className="eyebrow">Personal styling assistant</p>
                <h2>Discover Your Personal Style</h2>
                <p>
                  Upload a clear full-body photo and let AI create personalized clothing, color, footwear and outfit recommendations.
                </p>

                <div className="style-features">
                  <div className="style-feature">
                    <span>🧍</span>
                    <div>
                      <strong>Proportion Analysis</strong>
                      <p>Understand visible proportions for better clothing fits.</p>
                    </div>
                  </div>
                  <div className="style-feature">
                    <span>🎨</span>
                    <div>
                      <strong>Color Suggestions</strong>
                      <p>Get a practical color palette for everyday outfits.</p>
                    </div>
                  </div>
                  <div className="style-feature">
                    <span>👕</span>
                    <div>
                      <strong>Clothing Suggestions</strong>
                      <p>Get recommendations for shirts, T-shirts, jeans and trousers.</p>
                    </div>
                  </div>
                  <div className="style-feature">
                    <span>✨</span>
                    <div>
                      <strong>Complete Outfit Ideas</strong>
                      <p>Generate coordinated outfit combinations for different occasions.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PHOTO SECTION */}
              <div className="style-photo-section">
                <div className="style-photo-box">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Selected style"
                      className="style-photo-preview"
                    />
                  ) : (
                    <div className="style-photo-placeholder">
                      <span>📸</span>
                      <strong>Upload your photo</strong>
                      <p>Use a clear full-body photo for better recommendations.</p>
                    </div>
                  )}
                </div>

                <label className="style-upload-button">
                  📷 {previewUrl ? "Choose Another Photo" : "Choose Photo"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageChange}
                    hidden
                  />
                </label>

                {selectedImage && (
                  <div className="style-selected-file">
                    <span>✓</span>
                    <div>
                      <strong>{selectedImage.name}</strong>
                      <small>
                        {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                      </small>
                    </div>
                  </div>
                )}

                {error && <div className="style-error">⚠️ {error}</div>}
                {success && <div className="style-success">✓ {success}</div>}

                <button
                  type="button"
                  className="style-analyze-button"
                  onClick={handleAnalyze}
                  disabled={!selectedImage || loading}
                >
                  ✨ Analyze My Style
                </button>

                <div className="style-privacy-note">
                  🔒 Your photo is temporarily processed for style analysis and is not permanently stored by this feature.
                </div>
              </div>
            </div>
          </div>

          {/* INFORMATION CARDS */}
          <div className="style-info-grid">
            <div className="style-info-card">
              <span>👕</span>
              <h3>Clothing</h3>
              <p>Discover suitable shirt, T-shirt, jacket, jeans and trouser styles.</p>
            </div>
            <div className="style-info-card">
              <span>🎨</span>
              <h3>Colors</h3>
              <p>Get a personalized color palette for your everyday outfits.</p>
            </div>
            <div className="style-info-card">
              <span>👟</span>
              <h3>Footwear</h3>
              <p>Find footwear styles that complement your recommended outfits.</p>
            </div>
            <div className="style-info-card">
              <span>✨</span>
              <h3>Outfits</h3>
              <p>Generate complete casual, college, formal and occasion outfits.</p>
            </div>
          </div>

          {/* DISCLAIMER */}
          <div className="style-disclaimer">
            <strong>ℹ️ Important</strong>
            <p>
              AI style recommendations are based on visible characteristics and your provided profile information.
              Image analysis may be affected by lighting, camera angle, clothing and image quality.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// CLOTHING CATEGORY COMPONENT
// ==========================================

function ClothingCategory({ title, icon, items }) {
  const list = safeArray(items);

  return (
    <div className="style-clothing-category">
      <div className="style-clothing-category-header">
        <span>{icon}</span>
        <h4>{title}</h4>
      </div>

      {list.length > 0 ? (
        <ul>
          {list.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No specific recommendations returned.</p>
      )}
    </div>
  );
}

export default StyleAdvisor;