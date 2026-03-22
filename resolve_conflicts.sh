#!/bin/bash
git checkout HEAD -- package.json pnpm-lock.yaml src/components/Campsite/Campsite.jsx src/components/Facility/FacilitiesFinder.jsx src/components/Facility/FacilityDetails.jsx src/utils/browserCompatibility.js
git checkout origin/main -- package.json pnpm-lock.yaml src/components/Facility/FacilitiesFinder.jsx src/components/Facility/FacilityDetails.jsx src/utils/browserCompatibility.js
