#TODO switch to a template and use render
#from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return HttpResponse('hello response from mai_shogi_site app');
