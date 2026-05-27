from django.shortcuts import render , redirect, get_object_or_404
from products.models import Product
from . import models
from django.contrib import messages
from django.http import JsonResponse
# Create your views here.

def index(request):
    latest_dishes = Product.objects.all().order_by('-created_at')[:6]
    latest_dish = Product.objects.all().order_by('-created_at')[:1]
    context = {
        'latest_dishes':latest_dishes,
        'latest_dish':latest_dish,
    }
    return render(request, 'pages/index.html',context)


