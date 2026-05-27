from django.urls import path
from . import views
urlpatterns = [
    path('shop', views.shop, name='shop'),
    path('cart', views.cart, name='cart'),
    path('add-to-cart/<int:product_id>/', views.add_to_cart, name='add-to-cart'),
    path('remove-cart-item/<int:product_id>/',views.remove_cart_item, name='remove-cart-item'),
    path('clear-cart/',views.clear_cart, name='clear-cart'),   
    path('increase-quantity/<int:product_id>/', views.increase_quantity , name='increase-quantity'),
    path('decrease-quantity/<int:product_id>/', views.decrease_quantity , name='decrease-quantity'),
]