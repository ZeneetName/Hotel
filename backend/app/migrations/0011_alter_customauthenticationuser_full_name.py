from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0010_room_amenities_alter_dish_id_alter_hotelimage_id_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customauthenticationuser',
            name='full_name',
            field=models.CharField(max_length=64, verbose_name='Польное имя'),
        ),
    ]
