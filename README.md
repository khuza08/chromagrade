# Chromagrade

Chromagrade is a simple yet performant, web-based color grading and photo editing application. Built entirely with modern web technologies and powered by WebGL, it brings desktop-level color grading tools directly to your browser without sacrificing performance or capability.

<br>

<details>
<summary><b>Learn More</b></summary>

## 1. The Problem We Solve

**Target Audience:**
Students, photographers, videographers, content creators, and digital artists who need rapid, professional-grade color correction and grading without the steep learning curve, heavy hardware requirements, or subscription costs of traditional desktop software (like DaVinci Resolve or Adobe Lightroom/Classic).

**The Problem:**
Professional color grading tools like Adobe Lightroom Classic and DaVinci Resolve demand mid-range, high-end hardware and costly subscriptions just to get started. For millions of people on low-spec laptops, especially students, freelancers, and creators in developing regions this creates a hard barrier that excludes them from accessing professional-grade tools entirely.

**Our Impact:**
Chromagrade tears down both barriers at once. By running entirely in the browser and leveraging WebGL, it delivers real-time professional color grading on virtually any device no installation, no subscriptions, no minimum specs beyond a modern browser.



## 2. Our Solution

**User Experience (UX):**
Chromagrade is designed to be instantly intuitive while remaining incredibly powerful. The interface is clean, distraction-free, and organized into logical panels (Basic, Color Wheels, RGB Curves, HSL, LUTs).
- **Delightful Interactions:** Features like dynamic, color-shifting track gradients on sliders, real-time interactive histogram feedback, and instant A/B before/after visual comparisons make the grading process highly interactive and "fun" to explore.
- **Seamless Workflow:** The history system (undo/redo) is meticulously optimized to group slider drags, ensuring you never lose your place, and preset management makes jumping between styles effortless.

**Value Proposition:**
Chromagrade delivers measurable results by drastically reducing the time it takes to achieve a cinematic look.
- **Zero Install:** Instant access from any web browser.
- **Real-Time Performance:** Custom WebGL shaders process hi-res images with minimal lag.
- **Professional Tools:** Support for standard `.cube` LUTs, 3-way color wheels (Shadows, Midtones, Highlights), precise HSL color targeting, and parametric RGB tone curves.
- **Portability:** Export and import your entire grading workspace or bundle your custom preset collections to share with teams or clients.



## 3. Uniqueness & Innovation

**Originality:**
Unlike basic web photo editors that just apply simple CSS filters, Chromagrade implements close mathematical color science (Log-space grading, precise luminance preservation, advanced spline curve interpolation) directly via custom GLSL shaders. I built my own `CanvasEngine` from the ground up to ensure absolute color accuracy and extreme performance. I didn't use a standard photo editor template; I built a simple color grading suite natively for the web.

**The "Wow" Factor:**
Chromagrade goes beyond manual adjustments by integrating an algorithmic **Color Transfer (Match Color)** engine. With just one click, users can extract the exact color palette, tone curve, and atmospheric grading from a reference image and dynamically match their target image to it. This workflow allows users to instantly "close to" the visual of their favorite cinematic stills or photographs, achieving complex, beautiful grades in milliseconds rather than hours.

</details>


### Notes
Features that is in development may have bugs, weird behavior, innacurate, etc.
 - **In Research & Development**: Histogram, AutoHDR & SDRr, AutoWB(White Balance), Exposure, Vibrance


## Credits
Shutterstock for the FREE LUTs pack being used, and all people included in the references section.

## References & Color Science Acknowledgements

The mathematical foundations and algorithms powering Chromagrade's custom shaders and color processing were built by studying and implementing concepts from the following resources:

*   [High-dynamic-range (HDR) OpenCV](https://github.com/fmurciag/High-dynamic-range-HDR-opencv)
*   [Exposure algorithms](https://github.com/yuanming-hu/exposure)
*   [White balance algorithms - StackOverflow](https://stackoverflow.com/questions/1175393/white-balance-algorithm)
*   [Color balance - Wikipedia](https://en.wikipedia.org/wiki/Color_balance)
*   [Math behind white balance algorithms - StackOverflow](https://stackoverflow.com/questions/47013614/what-is-the-math-behind-white-balance-algorithms)
*   [White balancing: An enhancement technique in image processing](https://mattmaulion.medium.com/white-balancing-an-enhancement-technique-in-image-processing-8dd773c69f6)
*   [Algorithm for vibrance filters - StackOverflow](https://stackoverflow.com/questions/33966121/what-is-the-algorithm-for-vibrance-filters)
*   [Vibrancy vs Saturation - Reddit](https://www.reddit.com/r/postprocessing/comments/1h92e9z/vibrancy_vs_saturation_can_someone_in_their_own/)
*   [Vibrance.hlsl - SweetFX](https://github.com/zachsaw/RenderScripts/blob/master/RenderScripts/ImageProcessingShaders/SweetFX/Vibrance.hlsl)
*   [Functional difference between Vibrance and Saturation - Reddit](https://www.reddit.com/r/photography/comments/kyyvp/can_someone_explain_the_functional_difference/)
*   [Exposure vs Brightening - DPReview](https://www.dpreview.com/articles/8148042898/exposure-vs-brightening)
*   [Difference between Exposure, Brightness, and Brilliance - StackExchange](https://photo.stackexchange.com/questions/85362/difference-between-exposure-brightness-and-brilliance-settings)
*   [How to recreate the math behind Photoshop curves - StackOverflow](https://stackoverflow.com/questions/4356788/how-to-recreate-the-math-behind-photoshop-curves)
*   [HSL and HSV - Wikipedia](https://en.wikipedia.org/wiki/HSL_and_HSV)
*   [HSL interpolation - StackOverflow](https://stackoverflow.com/questions/1416560/hsl-interpolation)
*   [What a LUT is and how to use it - Reddit](https://www.reddit.com/r/videography/comments/2pcjsp/can_someone_explain_what_a_lut_is_and_how_to_use/)
*   [What are and how to use LUTs in color grading - Vegas Creative Software](https://www.vegascreativesoftware.com/blog/what-are-and-how-use-luts-in-color-grading/)
*   [Using Color Correction and Grading LUTs - Adobe](https://helpx.adobe.com/premiere-elements/using/color-correction-and-grading-luts.html)
*   [Layer White Balance - GIMP](https://docs.gimp.org/2.10/en/gimp-layer-white-balance.html)
*   [Histogram Dialog - GIMP](https://docs.gimp.org/3.0/en/gimp-histogram-dialog.html)

*...and many more community resources and research papers that helped shape the engine.*
