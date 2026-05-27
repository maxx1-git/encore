from django.shortcuts import render, get_object_or_404, redirect
from . import models
from django.contrib import messages
from django.http import JsonResponse
# Create your views here.


# ====================================
#             Shop Views
# ====================================
def shop(request):
    alldishes = models.Product.objects.all()
    categories_data = {
    'main': {
        'title': 'Main Plates',
        'items': alldishes.filter(dish_category='main')
    },

    'pasta': {
        'title': 'Pasta & Hand-folded',
        'items': alldishes.filter(dish_category='pasta')
    },

    'bowl': {
        'title': 'Bowls & Greens',
        'items': alldishes.filter(dish_category='bowl')
    },

    'dessert': {
        'title': 'Desserts',
        'items': alldishes.filter(dish_category='dessert')
    },
}
    return render(request, 'products/shop.html', {'categories':categories_data})


# ====================================
#          Add to Cart Views
# ====================================
def add_to_cart(request, product_id):

    if request.method == 'GET' or request.headers.get('x-requested-with') == 'XMLHttpRequest':

        product = get_object_or_404(models.Product, id=product_id)

        cart = request.session.get('cart', {})

        if str(product_id) in cart:
            cart[str(product_id)] += 1
        else:
            cart[str(product_id)] = 1

        request.session['cart'] = cart
        request.session.modified = True

        message_text = f"{product.dish_name} Added To Cart Successfully !"

        return JsonResponse({
            'success': True,
            'message': message_text,
            'item_count': sum(cart.values()),
        })

    return JsonResponse({
        'success': False,
        'message': 'invaild request'
    }, status=400)



# ====================================
#             Cart Views
# ====================================
def cart(request):

    cart = request.session.get('cart', {})

    products = models.Product.objects.filter(
        id__in=[int(id) for id in cart.keys()]
    )

    cart_items = []

    total = 0

    for product in products:

        quantity = cart[str(product.id)]

        item_total = product.dish_price * quantity

        total += item_total

        cart_items.append({
            'product': product,
            'quantity': quantity,
            'item_total': item_total,
        })

    return render(request, 'products/cart.html', {
        'cart_items': cart_items,
        'total': total
    })



# ====================================
#        Remove From Cart Views
# ====================================
def remove_cart_item(request, product_id):
    cart = request.session.get('cart',{})
    product_id = str(product_id)
    if product_id in cart:
        del cart[product_id]
        request.session['cart'] = cart
    return redirect('cart')



# ====================================
#          Clear Cart Views
# ====================================
def clear_cart(request):
    request.session['cart'] = {}
    return redirect('cart')



# ====================================
#       Increase Quantity Views
# ====================================
def increase_quantity(request, product_id):

    cart = request.session.get('cart', {})

    product_id = str(product_id)

    if product_id in cart:

        cart[product_id] += 1

        request.session['cart'] = cart

    return redirect('cart')




# ====================================
#       Decrease Quantity Views
# ====================================
def decrease_quantity(request, product_id):

    cart = request.session.get('cart', {})

    product_id = str(product_id)

    if product_id in cart:

        cart[product_id] -= 1

        if cart[product_id] <= 0:
            del cart[product_id]

        request.session['cart'] = cart

    return redirect('cart')