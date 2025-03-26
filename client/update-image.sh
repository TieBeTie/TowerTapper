npm run build
docker-compose build client
docker tag towertapperprod-client:latest tiebetie/towertapper-client:latest
docker push tiebetie/towertapper-client:latest
