# syntax=docker/dockerfile:1
# from https://docs.docker.com/samples/django/
FROM ubuntu:22.04
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /mai_shogi_project
RUN	apt update && \
	apt install -y libpq-dev && \
	apt install -y python3-pip && \
	apt install -y supervisor
RUN mkdir /daphne
COPY daphne/daphne.conf /etc/daphne/daphne.conf
COPY requirements.txt /mai_shogi_project/
RUN python3 -m pip install -r requirements.txt
