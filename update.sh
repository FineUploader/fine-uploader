###
# This will update the build number as part of each push (only in the develop branch).
#
# To install this hook:
# 1.) chmod +x update.sh
# 2.) ln -s -f ../../update.sh .git/hooks/update
###
BRANCH=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')
echo $BRANCH
if [ $BRANCH == "develop" ]; then
    grunt version:build
    RESULT=$?
    [ $RESULT -ne 0 ] && exit 1
    git add -u
    git commit -a -m "update version"
    exit 0
fi
