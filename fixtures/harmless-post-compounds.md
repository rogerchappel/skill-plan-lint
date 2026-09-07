# Image Finishing Skill

## When To Use
Use this skill when an image needs local finishing work.

## Inputs And Tools
Provide an image and use the local image-processing tool.

## Side-Effect Boundaries
Processing is local-only and does not mutate the source image.

## Approval Requirements
Approval is required before applying the finished image.

## Examples
Apply post-processing to the image, then preview the result.

## Validation
Run the image comparison test before returning the result.

## Limitations And Fallback
Color matching is approximate; fall back to the original image when validation fails.
