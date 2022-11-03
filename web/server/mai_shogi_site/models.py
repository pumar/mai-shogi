from django.db import models

# Create your models here.
class GameInstance(models.Model):
    game_code = models.CharField(max_length=16)
    sente_player_code = models.CharField(max_length=16)
    gote_player_code = models.CharField(max_length=16)
