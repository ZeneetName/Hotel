from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0005_remove_review_text_alter_review_comment_text"),
    ]

    operations = [
        migrations.AddField(
            model_name="hotel",
            name="city",
            field=models.CharField(
                blank=True,
                default="",
                max_length=128,
                verbose_name="Город",
            ),
        ),
    ]
