# Start a server in the main repo root
#
# Use these in another tab:
# npm install http-server -g
# http-server -p 8000 --cors

# Start the Meteor StandaloneViewer server
cd dev/Viewers/StandaloneViewer/StandaloneViewer
export METEOR_PACKAGE_DIRS="../../Packages"
meteor