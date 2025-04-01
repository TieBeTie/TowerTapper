npm run build
docker-compose build
docker tag towertapperprod-client:latest tiebetie/towertapper-client:latest
docker push tiebetie/towertapper-client:latest
docker tag towertapperprod-server:latest tiebetie/towertapper-server:latest
docker push tiebetie/towertapper-server:latest

