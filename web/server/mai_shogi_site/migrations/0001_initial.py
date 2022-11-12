# Generated by Django 4.1.3 on 2022-11-06 01:39

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='GameInstance',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('game_code', models.CharField(max_length=16)),
                ('sente_player_code', models.CharField(max_length=16)),
                ('gote_player_code', models.CharField(max_length=16)),
            ],
        ),
    ]