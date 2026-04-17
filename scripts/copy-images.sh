#!/bin/bash
# Copy images to mobile public folder
cp -r frontend/public/images mobile/ 2>/dev/null || true
echo "Images ready"
