# Generated by Django 3.1 on 2020-10-14 18:54

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0005_auto_20201014_1149'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='like',
            unique_together=set(),
        ),
    ]
