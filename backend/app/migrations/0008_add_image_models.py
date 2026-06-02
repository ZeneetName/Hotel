# Generated migration for adding HotelImage and RoomImage models

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0007_room_max_place_room_square_room_title_and_more'),
    ]

    operations = [
        # Create HotelImage model
        migrations.CreateModel(
            name='HotelImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='hotel_images/', verbose_name='Фотография отеля')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('hotel', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='app.hotel', verbose_name='Отель')),
            ],
        ),
        # Create RoomImage model
        migrations.CreateModel(
            name='RoomImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='room_images/', verbose_name='Фотография номера')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='app.room', verbose_name='Номер')),
            ],
        ),
        # Alter hostel_images field - remove unique constraint
        migrations.AlterField(
            model_name='hotel',
            name='hostel_images',
            field=models.ImageField(blank=True, null=True, upload_to='', verbose_name='Фотография'),
        ),
        # Alter room_images field - remove unique constraint
        migrations.AlterField(
            model_name='room',
            name='room_images',
            field=models.ImageField(blank=True, null=True, upload_to='', verbose_name='Фотография номера'),
        ),
    ]
