###############################################################################
# Mosquitto MQTT broker for PortVision.
# Build context: repo root (so we can copy the conf file).
#   docker build -f docker/mosquitto.Dockerfile -t portvision-mosquitto .
###############################################################################

FROM eclipse-mosquitto:2

COPY docker/mosquitto.conf /mosquitto/config/mosquitto.conf

EXPOSE 1883
