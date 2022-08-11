# syntax=docker/dockerfile:1
# from https://docs.docker.com/samples/django/
FROM python:3
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /mai_shogi_project
COPY requirements.txt /mai_shogi_project/
RUN pip install -r requirements.txt

