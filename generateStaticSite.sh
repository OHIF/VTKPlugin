# Build and copy the StandaloneViewer into the static directory
rm -rf build
rm -rf Viewers

mkdir build
git clone https://github.com/OHIF/Viewers.git
cd Viewers/StandaloneViewer
echo $DEPLOY_PRIME_URL
export ROOT_URL=$DEPLOY_PRIME_URL
export METEOR_PACKAGE_DIRS="../../Packages"
cd StandaloneViewer
mkdir -p client/staticSiteSupport
cp -R ../../../staticSiteSupport/startup/* client/staticSiteSupport/

mkdir -p public/plugins/VTKPlugin/lib
cp -R ../../../lib/* public/plugins/VTKPlugin/lib/

mkdir -p public/plugins/VTKPlugin/multiplanarReformatting
cp -R ../../../multiplanarReformatting/* public/plugins/VTKPlugin/multiplanarReformatting/

mkdir -p public/plugins/VTKPlugin/volumeRendering
cp -R ../../../volumeRendering/* public/plugins/VTKPlugin/volumeRendering/

# Temporary: Overwrite the toolbar section to add some custom buttons:
cp ../../../staticSiteSupport/toolbarSection.js client/components/toolbarSection/toolbarSection.js

npm install -g meteor-build-client-fixed@0.4.3
meteor-build-client-fixed --version
curl https://install.meteor.com | /bin/sh
export PATH=$HOME/.meteor:$PATH
meteor npm install
meteor-build-client-fixed ../../../build -u $ROOT_URL --path './'