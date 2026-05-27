from django.db import models
from datetime import date
# Create your models here.



class Product(models.Model):

    CATEGORY_CHOICES = (
        ('main','Main Plates'),
        ('pasta','Pasta & Hand-folded'),
        ('bowl','Bowls & Greens'),
        ('dessert','Desserts'),
    )
    


    dish_name = models.CharField(max_length=50)
    dish_description = models.TextField(max_length=200, blank=True, null=True)
    dish_price = models.DecimalField(max_digits=6,decimal_places=2)
    dish_photo = models.ImageField(upload_to='products/%Y/%m/%d/')
    dish_category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.dish_name} ({self.get_dish_category_display()})"

    class Meta:
        ordering = ['dish_category']