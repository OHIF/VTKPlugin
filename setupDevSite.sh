if [ -e dev ]
then
  read -p "You have a dev directory already - okay to delete it? " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]
  then
      rm -rf dev
  else
      echo
      echo "Okay, won't do anything then"
      exit
  fi
fi

echo "Okay, installing dev environment"

mkdir dev
cd dev
git clone https://github.com/OHIF/Viewers.git

export METEOR_PACKAGE_DIRS="../../Packages"

rm -rf OHIFViewer
rm -rf LesionTracker
rm -rf test
rm -rf dockersupport
rm -rf img
rm -rf config

cd Viewers/StandaloneViewer/StandaloneViewer
mkdir -p client/staticSiteSupport
cp -R ../../../../staticSiteSupport/devStartup/ client/staticSiteSupport/

# Temporary: Overwrite the toolbar section to add some custom buttons:
cp ../../../../staticSiteSupport/toolbarSection.js client/components/toolbarSection/toolbarSection.js

meteor npm install
