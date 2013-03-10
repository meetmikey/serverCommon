read -p "This will delete and recreate the index. ARE YOU SURE (y/n)?? " -n 1
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo -e "\n"
  ./deleteIndex.sh
  echo -e "\n"
  ./createIndex.sh
  echo -e "\n"
  ./createAlias.sh
  echo -e "\n"
  ./putMapping.sh
  echo -e "\n"
  echo -e "God damnit leeroy."
  exit 1
fi
